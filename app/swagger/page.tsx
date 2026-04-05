'use client'

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function SwaggerPage() {
  return (
    <div style={{ padding: '1rem' }}>
      <SwaggerUI url="/api/swagger" />
    </div>
  )
}
