import type { TaskId } from "./graph-types";

/* copied from graph-types.ts */
function toMapById(nodes: TaskId[]): Map<string, TaskId> {
  let nodeMap = new Map<string, TaskId>();
  for (let task of nodes) {
      if (task.id in nodeMap)
          throw 'duplicate IDs';
      nodeMap.set(task.id, task);
  }
  return nodeMap;
}

export function taskForce(): d3.Force<TaskId, undefined> {
  let myNodes: TaskId[] | null = null;
  let deps: Map<string, number> = new Map();
  let idMap: Map<string, TaskId> = new Map();

  function getNumberOfDeps(task: TaskId): number {
    if (deps.has(task.id)) return deps.get(task.id)!;

    if (task.task.requires.length == 0) return 0;

    let res = 0;
    for (let r of task.task.requires) {
      res += getNumberOfDeps(idMap.get(r)!) + 1;
    }
    deps.set(task.id, res);
    return res;
  }

  let force: d3.Force<TaskId, undefined> = function(alpha: number) {
    if (myNodes == null) throw 'nodes not initialized';

    for (let task of myNodes) {
      if (task.vy == null) {
        task.vy = 0
      }

      task.vy += getNumberOfDeps(task) * 25 * alpha;
    }
  }

  force.initialize = function(nodes: TaskId[]) {
    myNodes = nodes;
    idMap = toMapById(myNodes);
  }

  return force;
}
