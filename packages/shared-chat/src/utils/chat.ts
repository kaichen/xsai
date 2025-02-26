import type { CommonRequestOptions } from '@xsai/shared'

import { requestBody, requestHeaders, requestURL, responseCatch } from '@xsai/shared'

import type { Message, Tool, ToolChoice } from '../types'

export interface ChatOptions extends CommonRequestOptions {
  [key: string]: unknown
  messages: Message[]
  toolChoice?: ToolChoice
}

export const chat = async <T extends ChatOptions>(options: T) =>
  (options.fetch ?? globalThis.fetch)(requestURL('chat/completions', options.baseURL), {
    body: requestBody({
      ...options,
      tools: (options.tools as Tool[] | undefined)?.map(tool => ({
        function: tool.function,
        type: 'function',
      })),
    }),
    headers: requestHeaders({
      'Content-Type': 'application/json',
      ...options.headers,
    }, options.apiKey),
    method: 'POST',
    signal: options.abortSignal,
  }).then(responseCatch)
