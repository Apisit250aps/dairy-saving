declare module '*.css' {
  const content: string
  export default content
}

declare module '*.scss' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

type ApiResponse<T> = {
  success: boolean
  message: string
  data?: T
  error?: string
}
