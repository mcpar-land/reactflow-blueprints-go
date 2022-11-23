package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type Node struct {
	Id       string     `json:"id"`
	Position XYPosition `json:"position"`
	Data     NodeData   `json:"data"`
	Type     string     `json:"type"`
}

type NodeData struct {
	Inputs  map[string]any `json:"inputs"`
	Outputs map[string]any `json:"outputs"`
}

type XYPosition struct {
	X float32 `json:"x"`
	Y float32 `json:"y"`
}

type Edge struct {
	Type         string `json:"type"`
	Source       string `json:"source"`
	Target       string `json:"target"`
	SourceHandle string `json:"sourceHandle"`
	TargetHandle string `json:"targetHandle"`
	Data         any    `json:"data"`
}

type EdgeRunner func(data NodeData, inputs map[string]any) (map[string]any, error)

type NodeTypes map[string]EdgeRunner

type RunRequest struct {
	Nodes  []Node `json:"nodes"`
	Edges  []Edge `json:"edges"`
	Target string `json:"target"`
}

func ParseRunRequest(r *http.Request) (*RunRequest, error) {
	var rq RunRequest
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(body, &rq)
	if err != nil {
		return nil, err
	}
	return &rq, nil
}

func AsString(n any) (string, error) {
	if s, ok := n.(string); ok {
		return s, nil
	}
	return "", fmt.Errorf("Value %v is not a string", n)
}

func AsNumber(n any) (float32, error) {
	if s, ok := n.(float32); ok {
		return s, nil
	}
	return 0, fmt.Errorf("Value %v is not a number", n)
}

func AsBoolean(n any) (bool, error) {
	if s, ok := n.(bool); ok {
		return s, nil
	}
	return false, fmt.Errorf("Value %v is not a boolean", n)
}

var nodeTypes = NodeTypes{
	"concat": func(data NodeData, inputs map[string]any) (map[string]any, error) {
		return map[string]any{
			"out": fmt.Sprintf("%v%v", inputs["a"], inputs["b"]),
		}, nil
	},
	"stringLit": func(data NodeData, inputs map[string]any) (map[string]any, error) {
		return map[string]any{
			"value": data.Outputs["value"],
		}, nil
	},
	"split": func(data NodeData, inputs map[string]any) (map[string]any, error) {
		src, err := AsString(inputs["src"])
		if err != nil {
			return nil, err
		}
		around, err := AsString(inputs["around"])
		if err != nil {
			return nil, err
		}
		res := strings.SplitN(src, around, 2)
		before := res[0]
		after := ""
		if len(res) >= 2 {
			after = res[1]
		}
		return map[string]any{"before": before, "after": after}, nil
	},
}

func Run(r *http.Request) (map[string]any, error) {
	rq, err := ParseRunRequest(r)
	if err != nil {
		return nil, err
	}
	bp, err := NewBlueprint(*rq)
	if err != nil {
		return nil, err
	}
	res, err := bp.Execute(&nodeTypes, rq.Target)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func main() {

	r := chi.NewRouter()
	r.Use(middleware.Logger)

	r.Post("/run", func(w http.ResponseWriter, r *http.Request) {
		res, err := Run(r)
		if err != nil {
			http.Error(w, fmt.Sprintf("%v", err), 500)
			return
		}
		response, err := json.Marshal(res)
		if err != nil {
			http.Error(w, fmt.Sprintf("%v", err), 500)
			return
		}
		w.Header().Add("Content-Type", "application/json")
		w.Write(response)
	})

	r.Post("/echo", func(w http.ResponseWriter, r *http.Request) {
		rq, err := ParseRunRequest(r)
		if err != nil {
			http.Error(w, fmt.Sprintf("%v", err), 300)
			return
		}
		bp, err := NewBlueprint(*rq)
		if err != nil {
			http.Error(w, fmt.Sprintf("%v", err), 300)
			return
		}
		echo, err := json.Marshal(bp)
		w.Header().Add("Content-Type", "application/json")
		w.Write(echo)
	})

	r.Get("/hello", func(w http.ResponseWriter, r *http.Request) {
		io.WriteString(w, "Hello!")
	})

	fmt.Println("Listening on 3009")
	http.ListenAndServe("localhost:3009", r)
}
