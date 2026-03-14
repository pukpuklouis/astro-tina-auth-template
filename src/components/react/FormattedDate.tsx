import React from 'react'

function FormattedDate({ date }: { date?: string | null }) {
	if (!date) return null

	const parsedDate = new Date(date)
	if (Number.isNaN(parsedDate.getTime())) return null

	return (
		<time dateTime={parsedDate.toISOString()}>
			{parsedDate.toLocaleDateString('en-us', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			})}
		</time>
	)
}

export default FormattedDate
