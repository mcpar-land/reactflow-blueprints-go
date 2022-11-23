import classNames from 'classnames';
import { useMemo } from 'react';
import {
  Handle,
  HandleType,
  NodeProps,
  Position,
  useEdges,
  useNodes,
} from 'reactflow';

export interface BpNodeDefinition {
  label: string;
  inputs: (ctx: BpNodeCtx) => BpPort[];
  outputs: (ctx: BpNodeCtx) => BpPort[];
  // run: (inputs: BpValueMap) => BpValueMap;
}

export type BpValue = string | number | boolean;
export type BpValueMap = Record<string, BpValue>;

export type BpNodeCtx = any;

export interface BpPort {
  id: string;
  kind: 'string' | 'number' | 'boolean';
  label?: string;
  showInput?: boolean;
}

export type NodeData = {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  extra: any;
};

export const makeBpNodeComponent =
  (def: BpNodeDefinition, updateNode: (id: string, data: NodeData) => void) =>
  ({ data, id, selected }: NodeProps<NodeData>) => {
    const inputPorts = def.inputs({});
    const outputPorts = def.outputs({});

    return (
      <div
        className={classNames(
          'bg-white border border-gray-600 rounded p-2 flex flex-col gap-1',
          selected && 'outline outline-1'
        )}
      >
        <div className="font-bold border-b">{def.label}</div>
        <div className="flex flex-row w-full">
          <div className="flex flex-col flex-grow w-1/2">
            {inputPorts.map((port, i) => (
              <BpPort
                nodeId={id}
                port={port}
                key={port.id}
                type="target"
                i={i}
                value={data.inputs[port.id] ?? ''}
                onChange={(v) => {
                  updateNode(id, {
                    ...data,
                    inputs: {
                      ...data.inputs,
                      [port.id]: v,
                    },
                  });
                }}
              />
            ))}
          </div>
          <div className="bp-node-rows">
            {outputPorts.map((port, i) => (
              <BpPort
                nodeId={id}
                port={port}
                key={port.id}
                type="source"
                i={inputPorts.length + i}
                value={data.outputs[port.id] ?? ''}
                onChange={(v) => {
                  updateNode(id, {
                    ...data,
                    outputs: {
                      ...data.outputs,
                      [port.id]: v,
                    },
                  });
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

const handleClasses = {
  number: 'bg-green-400',
  string: 'bg-yellow-400',
  boolean: 'bg-red-400',
};

function BpPort({
  nodeId,
  port,
  type,
  value,
  onChange,
}: {
  nodeId: string;
  port: BpPort;
  type: HandleType;
  i: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const nodes = useNodes();
  const edges = useEdges();

  const connectedEdge = useMemo(
    () =>
      edges.find((e) =>
        type === 'target'
          ? e.target === nodeId && e.targetHandle === port.id
          : e.source === nodeId && e.sourceHandle === port.id
      ),
    [edges]
  );

  return (
    <div
      className={classNames(
        'flex items-center gap-2',
        type === 'target'
          ? 'flex-row translate-x-[-14px]'
          : 'flex-row-reverse translate-x-[14px]'
      )}
    >
      <Handle
        className={classNames(
          '!h-[10px] !w-[10px] !transform-none static',
          handleClasses[port.kind]
        )}
        type={type}
        position={type === 'target' ? Position.Left : Position.Right}
        id={port.id}
      />
      <div>
        {port.showInput || (!connectedEdge && type === 'target') ? (
          <div className="flex flex-col gap-1">
            {port.label && (
              <div
                className={classNames(
                  'text-xs',
                  type === 'target' ? 'text-left' : 'text-right'
                )}
              >
                {port.label}
              </div>
            )}
            <input
              className="border border-slate-600 rounded-sm px-1"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        ) : (
          port.label && <span>{port.label}</span>
        )}
      </div>
    </div>
  );
}
