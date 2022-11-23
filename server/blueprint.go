package main

import "fmt"

type Blueprint struct {
	Nodes map[string]Node
	// map of Node IDs and their incoming edges.
	Edges map[string][]Edge
}

func NewBlueprint(req RunRequest) (*Blueprint, error) {
	b := Blueprint{
		Nodes: map[string]Node{},
		Edges: map[string][]Edge{},
	}
	for _, node := range req.Nodes {
		b.Nodes[node.Id] = node
	}
	for _, edge := range req.Edges {
		if _, ok := b.Edges[edge.Target]; !ok {
			b.Edges[edge.Target] = []Edge{}
		}
		b.Edges[edge.Target] = append(b.Edges[edge.Target], edge)
	}

	return &b, nil
}

func (b *Blueprint) GetNode(id string) (*Node, error) {
	if _, ok := b.Nodes[id]; !ok {
		return nil, fmt.Errorf("Node '%s' not found", id)
	}
	var n Node = b.Nodes[id]
	return &n, nil
}

func (b *Blueprint) Execute(
	types *NodeTypes,
	nodeId string,
) (map[string]any, error) {
	target, err := b.GetNode(nodeId)
	if err != nil {
		return nil, fmt.Errorf("Couldn't get target: %v", err)
	}
	executor, ok := (*types)[target.Type]
	if !ok {
		return nil, fmt.Errorf(
			"Unable to find node type '%s' for node '%s'",
			target.Type,
			nodeId,
		)
	}

	fmt.Println("Running execution on node", target.Id)

	inputs := target.Data.Inputs
	for _, edge := range b.Edges[nodeId] {
		res, err := b.Execute(types, edge.Source)
		if err != nil {
			return nil, fmt.Errorf("exe:%v -> %v", nodeId, err)
		}
		inputs[edge.TargetHandle] = res[edge.SourceHandle]
	}

	fmt.Printf("Created inputs for %s: %v\n", target.Id, inputs)

	outputs, err := executor(target.Data, inputs)
	if err != nil {
		return nil, err
	}

	fmt.Printf("Created outputs for %s: %v\n", target.Id, outputs)

	return outputs, nil
}
