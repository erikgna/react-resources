export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export const httpClient = {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url)

    if (!response.ok) {
      throw new HttpError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response.statusText
      )
    }

    return response.json()
  },

  async post<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new HttpError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response.statusText
      )
    }

    return response.json()
  },

  async put<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new HttpError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response.statusText
      )
    }

    return response.json()
  },

  async delete<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new HttpError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response.statusText
      )
    }

    return response.json()
  }
}
