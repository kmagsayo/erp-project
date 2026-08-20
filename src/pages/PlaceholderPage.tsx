import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'

interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-text-secondary">
            {title} module — ready for implementation.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
