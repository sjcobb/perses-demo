package v1

import (
	"encoding/json"
	"fmt"

	"gopkg.in/yaml.v2"
)

type LayoutKind string

const (
	KindExpandLayout LayoutKind = "Expand"
	KindGridLayout   LayoutKind = "Grid"
)

var layoutKindMap = map[LayoutKind]bool{
	KindExpandLayout: true,
	KindGridLayout:   true,
}

func (k *LayoutKind) UnmarshalJSON(data []byte) error {
	var tmp LayoutKind
	type plain LayoutKind
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *LayoutKind) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp LayoutKind
	type plain LayoutKind
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *LayoutKind) validate() error {
	if len(*k) == 0 {
		return fmt.Errorf("layout.kind cannot be empty")
	}
	if _, ok := layoutKindMap[*k]; !ok {
		return fmt.Errorf("unknown layout.kind '%s' used", *k)
	}
	return nil
}

type LayoutParameter interface {
}

type ExpandLayoutParameter struct {
	LayoutParameter `json:"-" yaml:"-"`
	Open            bool       `json:"open" yaml:"open"`
	Children        []*JSONRef `json:"children" yaml:"children"`
}

type GridCell struct {
	Width   uint     `json:"width" yaml:"width"`
	Content *JSONRef `json:"content,omitempty" yaml:"content,omitempty"`
}

type GridLayoutParameter struct {
	LayoutParameter `json:"-" yaml:"-"`
	Children        [][]GridCell `json:"children" yaml:"children"`
}

type tmpDashboardLayout struct {
	Kind      LayoutKind             `json:"kind" yaml:"kind"`
	Parameter map[string]interface{} `json:"parameter" yaml:"parameter"`
}

type DashboardLayout struct {
	Kind      LayoutKind      `json:"kind" yaml:"kind"`
	Parameter LayoutParameter `json:"parameter" yaml:"parameter"`
}

func (d *DashboardLayout) UnmarshalJSON(data []byte) error {
	jsonUnmarshalFunc := func(panel interface{}) error {
		return json.Unmarshal(data, panel)
	}
	return d.unmarshal(jsonUnmarshalFunc, json.Marshal, json.Unmarshal)
}

func (d *DashboardLayout) UnmarshalYAML(unmarshal func(interface{}) error) error {
	return d.unmarshal(unmarshal, yaml.Marshal, yaml.Unmarshal)
}

func (d *DashboardLayout) unmarshal(unmarshal func(interface{}) error, staticMarshal func(interface{}) ([]byte, error), staticUnmarshal func([]byte, interface{}) error) error {
	var tmpLayout tmpDashboardLayout
	if err := unmarshal(&tmpLayout); err != nil {
		return err
	}
	d.Kind = tmpLayout.Kind

	if len(tmpLayout.Kind) == 0 {
		return fmt.Errorf("variable.kind cannot be empty")
	}

	rawParameter, err := staticMarshal(tmpLayout.Parameter)
	if err != nil {
		return err
	}
	var parameter interface{}
	switch tmpLayout.Kind {
	case KindGridLayout:
		parameter = &GridLayoutParameter{}
	case KindExpandLayout:
		parameter = &ExpandLayoutParameter{}
	}
	if err := staticUnmarshal(rawParameter, parameter); err != nil {
		return err
	}
	d.Parameter = parameter
	return nil
}