"use client";

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
    ReactFlow,
    addEdge,
    Connection,
    Edge,
    Node,
    useNodesState,
    useEdgesState,
    Background,
    Controls,
    MiniMap,
    ConnectionLineType,
    Panel,
    Handle,
    Position,
    NodeProps,
    ReactFlowProvider,
    BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { DollarSign, User, Activity, ArrowRight, Wallet } from 'lucide-react';

// --- Custom Node Component ---
interface MemberNodeData {
    name: string;
    investment: number;
    role: string;
    category?: string;
    email?: string;
    [key: string]: unknown;
}

const MemberNode = ({ data }: NodeProps<Node<MemberNodeData>>) => {
    const isLeader = data.role === 'leader';

    return (
        <div className={`px-4 py-3 shadow-2xl rounded-2xl border backdrop-blur-xl transition-all duration-300 group hover:scale-105 ${isLeader
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-card/40 border-border/60'
            }`}>
            {/* Connection dots */}
            <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-emerald-500 border-none opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${isLeader
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    : 'bg-gradient-to-br from-indigo-500 to-violet-600'
                    }`}>
                    {data.name.charAt(0)}
                </div>
                <div className="flex flex-col min-w-[120px]">
                    <span className="text-sm font-bold tracking-tight truncate">{data.name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <Wallet className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium text-emerald-500">${data.investment?.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Glowing Accent */}
            <div className={`absolute -bottom-px left-1/2 -translate-x-1/2 w-1/2 h-[2px] blur-sm transition-opacity group-hover:opacity-100 opacity-30 ${isLeader ? 'bg-emerald-500' : 'bg-indigo-500'
                }`} />

            <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-emerald-500 border-none opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

const nodeTypes = {
    member: MemberNode,
};

// --- Layout Helper (Dagre) ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 220;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? Position.Left : Position.Top;
        node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

        // We are shifting the dagre node position (which is center-based) to top-left
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
    });

    return { nodes, edges };
};

// --- Main Tree Component ---
interface NetworkTreeProps {
    data: any[];
}

const NetworkTreeInner = ({ data }: NetworkTreeProps) => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        data.forEach((p) => {
            nodes.push({
                id: p.id,
                type: 'member',
                data: {
                    name: p.name,
                    investment: p.investment,
                    role: p.role,
                    category: p.category,
                    email: p.email
                },
                position: { x: 0, y: 0 },
            });

            if (p.referrerId) {
                edges.push({
                    id: `e-${p.referrerId}-${p.id}`,
                    source: p.referrerId,
                    target: p.id,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#10b981', strokeWidth: 1.5, opacity: 0.4 },
                });
            }
        });

        return getLayoutedElements(nodes, edges);
    }, [data]);

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    useEffect(() => {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div className="h-[700px] w-full bg-card/20 rounded-3xl border border-border/40 overflow-hidden relative shadow-inner">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                className="bg-dot-pattern"
            >
                <Background color="rgba(16,185,129,0.05)" variant={BackgroundVariant.Dots} gap={20} size={1} />
                <Controls className="bg-card border-border/60 rounded-xl" />
                <MiniMap
                    nodeColor={(n) => n.data?.role === 'leader' ? '#10b981' : '#6366f1'}
                    maskColor="rgba(0, 0, 0, 0.1)"
                    className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl overflow-hidden shadow-2xl"
                />

                <Panel position="top-right" className="bg-card/80 backdrop-blur-xl p-4 rounded-2xl border border-border/60 shadow-2xl max-w-[200px] animate-fade-in-up">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-emerald-500" />
                        Live Network
                    </h4>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-medium">Leader / Founder</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                            <span className="text-[10px] font-medium">Community Member</span>
                        </div>
                        <div className="mt-3 h-px bg-border/60 w-full" />
                        <p className="text-[9px] text-muted-foreground leading-relaxed">
                            Hover over cards to see details. Drag nodes to explore relationships.
                        </p>
                    </div>
                </Panel>
            </ReactFlow>

            <style jsx global>{`
                .react-flow__edge-path {
                    stroke-dasharray: 5;
                    animation: dashdraw 30s linear infinite;
                }
                @keyframes dashdraw {
                    from { stroke-dashoffset: 500; }
                    to { stroke-dashoffset: 0; }
                }
                .bg-dot-pattern {
                    background-image: radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px);
                    background-size: 24px 24px;
                    opacity: 0.05;
                }
            `}</style>
        </div>
    );
};

export default function NetworkTree({ data }: NetworkTreeProps) {
    return (
        <ReactFlowProvider>
            <NetworkTreeInner data={data} />
        </ReactFlowProvider>
    );
}
