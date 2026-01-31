export type Course = {
	dept: string
	number: number
	title: string
	description: string
	prereqs?: string[] | string
	"cross-listed"?: string[]
}

export const getCourseId = (course: Course) => `${course.dept}-${course.number}`
