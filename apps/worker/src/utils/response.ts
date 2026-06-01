import type { ApiResponse } from '@eatwhat/shared'

export function json<T>(data: T, message = '操作成功', init?: ResponseInit): Response {
  const body: ApiResponse<T> = {
    code: 200,
    message,
    data
  }

  return Response.json(body, {
    ...init,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      ...init?.headers
    }
  })
}

export function fail(message: string, code = 400, status = 400): Response {
  return Response.json(
    {
      code,
      message,
      data: null
    },
    {
      status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    }
  )
}

export function preflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    }
  })
}
