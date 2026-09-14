"""Agent pipeline constants for node identifiers and execution statuses."""

# LangGraph and Execution Trace Node Identifiers
NODE_WORKSPACE = "workspace"
NODE_CODEBASE_SCANNER = "codebase_scanner"
NODE_PLANNER = "planner"
NODE_PATCH_GENERATOR = "patch_generator"
NODE_VALIDATOR = "validator"
NODE_PATCH_APPLIER = "patch_applier"
NODE_TEST_RUNNER = "test_runner"
NODE_ACCEPTANCE_VALIDATOR = "acceptance_validator"
NODE_PR_METADATA_GENERATOR = "pr_metadata_generator"
NODE_DRAFT_PR = "draft_pr"

# Execution Trace Event Statuses
STATUS_RUNNING = "running"
STATUS_SUCCESS = "success"
STATUS_FAILED = "failed"
STATUS_PENDING = "pending"
