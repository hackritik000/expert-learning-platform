// NOTE: Image chunk upload is good idea only for images larger then 5MB
//  in real production application I choose check image size and choose
//  should I use chunk upload or not

import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import * as path from 'node:path';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import { Elysia, type Static, t } from 'elysia';

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

const uploadCompleteSchema = t.Object({
  uploadId: t.String(),
  fileName: t.String(),
  totalChunks: t.Number(),
  folderName: t.String(),
});

type UploadCompleteBody = Static<typeof uploadCompleteSchema>;
const app = new Elysia();
app
  .use(cors())
  .use(
    staticPlugin({
      alwaysStatic: false,
      assets: 'public',
      prefix: '/public',
    }),
  )
  .get('check-health', () => ({ status: true }))
  .post(
    '/upload/chunk',
    async ({ request, query, set }) => {
      try {
        const { uploadId, chunkIndex } = query;

        const uploadDir = path.join('uploads', uploadId);

        await fsPromises.mkdir(uploadDir, { recursive: true });

        const chunkPath = path.join(uploadDir, `${chunkIndex}.part`);

        const bytes = await request.arrayBuffer();

        if (bytes.byteLength === 0) {
          set.status = 400;
          return { success: false, error: 'Empty chunk' };
        }

        await Bun.write(chunkPath, bytes);

        return {
          success: true,
          chunkIndex,
          size: bytes.byteLength,
        };
      } catch (error) {
        console.error('Chunk upload error:', error);
        set.status = 500;

        return {
          success: false,
          error: String(error),
        };
      }
    },
    {
      query: t.Object({
        uploadId: t.String(),
        chunkIndex: t.String(),
        totalChunks: t.String(),
        fileName: t.String(),
      }),
    },
  )
  .post(
    '/upload/complete',
    async ({ body, set }) => {
      try {
        const { uploadId, fileName, totalChunks, folderName } = body as UploadCompleteBody;
        const uploadDir = path.join('uploads', uploadId);
        const dir = path.join(uploadDir);
        const outputDir = path.join('public', folderName);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path.join(outputDir, fileName);

        const output = Bun.file(outputPath);

        const writer = output.writer();

        try {
          for (let i = 0; i < Number(totalChunks); i++) {
            const chunkPath = path.join(dir, `${i}.part`);

            const chunk = Bun.file(chunkPath);
            try {
              const buffer = await chunk.arrayBuffer();
              writer.write(buffer);
            } catch (error) {
              console.error(error);
            }
          }

          await writer.end();
          // Remove temporary chunks
          await fsPromises.rm(dir, {
            recursive: true,
            force: true,
          });

          const returnPath = folderName + '/' + fileName;
          return {
            success: true,
            file: returnPath,
          };
        } catch (error) {
          console.log(error);
          await writer.end();
          set.status = 500;

          return {
            success: false,
            error: String(error),
          };
        }
      } catch (error) {
        console.log(error);
      }
    },
    {
      body: uploadCompleteSchema,
    },
  )
  .listen(3000);

console.log(`🚀 Server running at ${app.server?.hostname}:${app.server?.port}`);
