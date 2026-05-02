import { dflow, handle } from '@/lib/proxy'

export async function GET() {
  return handle(() => dflow('/tags_by_categories'))
}
