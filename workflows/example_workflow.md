# Example Workflow

**Purpose:** Template for how to structure a workflow in the WAT framework.

## Objective

Describe the goal in plain language. What should happen when this workflow completes?

## Required Inputs

- **Input 1:** Description of what's needed
- **Input 2:** Any constraints or format requirements

## Tools to Use

1. `tools/example_tool.py` — What it does and when to run it
2. (Add more as needed)

## Steps

1. Verify inputs are present and valid
2. Run the appropriate tool(s) with the correct arguments
3. Check outputs; handle failures or missing data
4. Deliver final result (e.g., to cloud service, or return to user)

## Expected Outputs

- What the workflow produces
- Where it goes (file, sheet, API response, etc.)

## Edge Cases

- **If X fails:** Do Y
- **If data is missing:** Do Z
- **Rate limits / API errors:** Retry logic or fallback

