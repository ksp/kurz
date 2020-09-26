import sys
import json

# pokus se naimportovat graphviz
try:
    from graphviz import Digraph
except ModuleNotFoundError as e:
    print("ERROR: Nainstaluj si graphviz - `pip install graphviz`", file=sys.stderr)
    exit(1)

# nacist definici grafu
with open("tasks.json", "r") as f:
    definition = json.load(f)




dot = Digraph(comment='The Round Table')

# nodes
for task in definition["tasks"]:
    dot.node(task["id"], task["id"])

# edges
for task in definition["tasks"]:
    for req in task["requires"]:
        dot.edge(req, task['id'])

dot.render('out/round-table.gv', view=True)
