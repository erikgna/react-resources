import { useQueue } from '../features/queue/hooks'
import { QueueStats } from '../features/queue/components/queue-stats'
import { QueueTimeline } from '../features/queue/components/queue-timeline'
import { Spinner } from '../shared/ui/spinner'

export function QueuePage() {
  const { queueState, isLoading } = useQueue()

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Queue</h1>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <QueueStats queueState={queueState} />
          <QueueTimeline queueState={queueState} />
        </>
      )}
    </div>
  )
}
