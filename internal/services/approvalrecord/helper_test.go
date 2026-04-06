package serviceapprovalrecord

import "testing"

func TestNormalizeOverallStatus(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{name: "empty defaults to in progress", input: "", want: "In progress"},
		{name: "complete becomes approved", input: "Complete", want: "Approved"},
		{name: "approved stays approved", input: "Approved", want: "Approved"},
		{name: "explicit in progress stays in progress", input: "In progress", want: "In progress"},
		{name: "submitted stays in progress", input: "Submitted", want: "In progress"},
		{name: "pending stays in progress", input: "Pending", want: "In progress"},
		{name: "declined stays decline", input: "Declined", want: "Decline"},
		{name: "rejected stays decline", input: "Rejected", want: "Decline"},
		{name: "unknown defaults to in progress", input: "Awaiting review", want: "In progress"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := normalizeOverallStatus(tt.input); got != tt.want {
				t.Fatalf("normalizeOverallStatus(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}
