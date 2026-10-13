import { GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { ExamResult, SetId } from "./types";

function settings() {
  const names = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"] as const;
  for (const name of names) if (!process.env[name]) throw new Error(`Missing ${name}`);
  return { accountId: process.env.R2_ACCOUNT_ID!, accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!, bucket: process.env.R2_BUCKET_NAME! };
}

let client: S3Client | undefined;
function r2() {
  const value = settings();
  return client ??= new S3Client({
    region: "auto",
    endpoint: `https://${value.accountId}.r2.cloudflarestorage.com`,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: { accessKeyId: value.accessKeyId, secretAccessKey: value.secretAccessKey }
  });
}

function resultKey(setId: SetId, enrollmentNumber: string) {
  return `ml-exam/results/${setId}/${encodeURIComponent(enrollmentNumber)}.json`;
}

export async function resultExists(setId: SetId, enrollmentNumber: string) {
  try {
    await r2().send(new HeadObjectCommand({ Bucket: settings().bucket, Key: resultKey(setId, enrollmentNumber) }));
    return true;
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return false;
    throw error;
  }
}

export async function saveResult(result: ExamResult) {
  await r2().send(new PutObjectCommand({
    Bucket: settings().bucket,
    Key: resultKey(result.setId, result.enrollmentNumber),
    Body: JSON.stringify(result),
    ContentType: "application/json",
    Metadata: { set: result.setId, enrollment: result.enrollmentNumber }
  }));
}

export async function listResults() {
  const results: ExamResult[] = [];
  let continuationToken: string | undefined;
  do {
    const page = await r2().send(new ListObjectsV2Command({ Bucket: settings().bucket, Prefix: "ml-exam/results/", ContinuationToken: continuationToken }));
    for (const object of page.Contents ?? []) {
      if (!object.Key?.endsWith(".json")) continue;
      const response = await r2().send(new GetObjectCommand({ Bucket: settings().bucket, Key: object.Key }));
      results.push(JSON.parse(await response.Body!.transformToString()) as ExamResult);
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);
  return results;
}
