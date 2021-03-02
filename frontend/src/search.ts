import { grabSolution, grabAssignment } from './ksp-task-grabber';
import type { TasksFile } from './tasks';
import Fuse from 'fuse.js';


export type IndexedDocument = {
    id: string
    title: string
    solution: string
    assignment: string
}

export async function createIndex(tasks: TasksFile) : Promise<Fuse<IndexedDocument>> {
    // get all assignments and their solutions
    let data = await Promise.all(tasks.tasks.filter(t => {
        return t.type == 'open-data';
    }).map(t => {
        return Promise.all([
            grabAssignment(t.id),
            grabSolution(t.id)
        ])
    }));

    // construct task search documents
    let documents = data.map(([ass, sol]) => {
        return {
            'id': ass.id,
            'title': ass.name,
            'assignment': ass.description,
            'solution': sol.description
        }
    });

    // search options
    const options = {
        includeMatches: true,
        keys: ['title', 'assignment', 'solution'] // search in these fields
    }

    return new Fuse(documents, options)
}
