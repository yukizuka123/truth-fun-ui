export class DFlowApiError extends Error {
  constructor(
    public status: number,
    public endpoint: string,
    message: string
  ) {
    super(message)
    this.name = 'DFlowApiError'
  }
}
