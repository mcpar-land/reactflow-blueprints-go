import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
  OnConnect,
  MarkerType,
  HandleType,
} from 'reactflow';

import 'reactflow/dist/style.css';
import { makeBpNodeComponent, NodeData } from './components/BpNode';

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const selectedNode = useMemo(() => nodes.find((n) => n.selected), [nodes]);

  const updateNode = useCallback(
    (id: string, data: any) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === id) {
            return { ...node, data };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const nodeTypes = useMemo(
    () => ({
      stringLit: makeBpNodeComponent(
        {
          label: 'String',
          inputs: (_) => [],
          outputs: (_) => [
            {
              id: 'value',
              // label: 'String',
              kind: 'string',
              showInput: true,
            },
          ],
        },
        updateNode
      ),
      concat: makeBpNodeComponent(
        {
          label: 'Concat',
          inputs: (_) => [
            {
              id: 'a',
              label: 'A',
              kind: 'string',
            },
            {
              id: 'b',
              label: 'B',
              kind: 'string',
            },
          ],
          outputs: (_) => [
            {
              id: 'out',
              label: 'Out',
              kind: 'string',
            },
          ],
        },
        updateNode
      ),
      split: makeBpNodeComponent(
        {
          label: 'Split',
          inputs: (_) => [
            {
              id: 'src',
              label: 'Source',
              kind: 'string',
            },
            {
              id: 'around',
              label: 'Around',
              kind: 'string',
            },
          ],
          outputs: (_) => [
            {
              id: 'before',
              label: 'Before',
              kind: 'string',
            },
            {
              id: 'after',
              label: 'After',
              kind: 'string',
            },
          ],
        },
        updateNode
      ),
    }),
    []
  );

  const onConnect: OnConnect = useCallback(
    (params) =>
      setEdges((eds) => {
        return addEdge(
          {
            ...params,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          },
          eds
        );
      }),
    []
  );

  const addNode = (type: string) => {
    setNodes((nodes) => [
      ...nodes,
      {
        id: Math.random() * 1000 + '',
        type,
        data: {
          inputs: {},
          outputs: {},
          extra: null,
        },
        position: { x: 0, y: 0 },
      },
    ]);
  };

  const reqBody = useMemo(
    () => JSON.stringify({ nodes, edges, target: selectedNode?.id }, null, 2),
    [nodes, edges]
  );

  const runEcho = useCallback(() => {
    fetch('/api/echo', {
      method: 'POST',
      body: reqBody,
    })
      .then((res) => res.json())
      .then((res) => {
        console.log('Got echo response!', res);
      });
  }, [reqBody]);

  const runRun = useCallback(() => {
    fetch('/api/run', {
      method: 'POST',
      body: reqBody,
    })
      .then((res) => res.json())
      .then((res) => {
        console.log('Got run response!', res);
      });
  }, [reqBody]);

  return (
    <div className="flex">
      <div className="flex flex-col w-[100px]">
        <button onClick={() => addNode('stringLit')}>String Literal</button>
        <button onClick={() => addNode('concat')}>Concat</button>
        <button onClick={() => addNode('split')}>Split</button>
        <div style={{ height: '100px' }}></div>
        <button onClick={() => runEcho()}>Run Echo</button>
        {selectedNode && <button onClick={() => runRun()}>Run!</button>}
      </div>
      <div className="w-full h-[900px] border border-black">
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
      <div className="w-[500px] h-[900px] bg-slate-100 overflow-auto p-2">
        <pre>
          <code>{reqBody}</code>
        </pre>
      </div>
    </div>
  );
}

export default App;
