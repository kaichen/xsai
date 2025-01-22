import type { PartialDeep } from 'type-fest'

import { type Infer, type Schema, toJSONSchema } from '@typeschema/main'
import { streamText, type StreamTextOptions, type StreamTextResult } from '@xsai/stream-text'
import { parse } from 'best-effort-json-parser'

export interface StreamObjectOptions<T extends Schema> extends StreamTextOptions {
  schema: T
  schemaDescription?: string
  schemaName?: string
}

export interface StreamObjectResult<T extends Schema> extends StreamTextResult {
  partialObjectStream: ReadableStream<PartialDeep<Infer<T>>>
}

/** @experimental WIP */
export const streamObject = async <T extends Schema>(options: StreamObjectOptions<T>): Promise<StreamObjectResult<T>> =>
// eslint-disable-next-line @masknet/no-then
  streamText({
    ...options,
    response_format: {
      json_schema: {
        description: options.schemaDescription,
        name: options.schemaName ?? 'json_schema',
        schema: await toJSONSchema(options.schema),
        strict: true,
      },
      type: 'json_schema',
    },
    schema: undefined,
    schemaDescription: undefined,
    schemaName: undefined,
  }).then(({ chunkStream, finishReason, textStream: rawTextStream, usage }) => {
    const [textStream, rawPartialObjectStream] = rawTextStream.tee()

    let partialObjectData = ''
    let partialObjectSnapshot = {} as PartialDeep<Infer<T>>
    const partialObjectStream = rawPartialObjectStream.pipeThrough(new TransformStream({
      transform: (chunk, controller) => {
        partialObjectData += chunk
        try {
          const data = parse(partialObjectData) as PartialDeep<Infer<T>>

          if (JSON.stringify(partialObjectSnapshot) !== JSON.stringify(data)) {
            partialObjectSnapshot = data
            controller.enqueue(data)
          }
        }
        catch {}
      },
    }))

    return {
      chunkStream,
      finishReason,
      partialObjectStream,
      textStream,
      usage,
    }
  })

export default streamObject
