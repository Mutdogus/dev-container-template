# Data Model: VS Code Container Launch Fix

## Core Entities

### DevContainerConfig
Represents the parsed and validated devcontainer.json configuration.

**Attributes**:
- `id`: string - Unique identifier for the configuration
- `path`: string - File system path to devcontainer.json
- `rawConfig`: object - Parsed JSON content
- `isValid`: boolean - Configuration validation status
- `validationErrors`: ValidationError[] - List of validation issues
- `baseImage`: string - Docker base image specified
- `extensions`: string[] - VS Code extensions to install
- `buildArgs`: object - Docker build arguments
- `mounts`: MountPoint[] - Volume mount configurations
- `ports`: PortMapping[] - Port forwarding settings

### ValidationError
Represents a specific validation issue found in devcontainer.json.

**Attributes**:
- `code`: string - Error code (e.g., "INVALID_SYNTAX", "MISSING_REQUIRED_FIELD")
- `severity`: "error" | "warning" | "info" - Impact level
- `message`: string - Human-readable description
- `field`: string - JSON path to problematic field
- `suggestion`: string - Recommended fix
- `line`: number - Line number in source file
- `column`: number - Column position

### DockerEnvironment
Represents the Docker environment state and capabilities.

**Attributes**:
- `isRunning`: boolean - Docker daemon status
- `version`: string - Docker engine version
- `apiVersion`: string - Docker API version
- `availableImages`: DockerImage[] - List of available images
- `diskSpace`: DiskSpaceInfo - Available disk space
- `memoryLimit`: number - Available memory
- `networkConnectivity`: boolean - External network access
- `permissions`: PermissionStatus - Docker access permissions

### ContainerLaunchContext
Represents the complete context for a container launch attempt.

**Attributes**:
- `id`: string - Unique launch attempt identifier
- `config`: DevContainerConfig - Container configuration
- `environment`: DockerEnvironment - Docker environment state
- `startTime`: Date - Launch attempt start time
- `status`: "pending" | "building" | "running" | "failed" | "completed"
- `currentStep`: LaunchStep - Current launch phase
- `logs`: LogEntry[] - Accumulated logs
- `errors`: ContainerError[] - Errors encountered
- `metrics`: LaunchMetrics - Performance metrics

### ContainerError
Represents an error that occurred during container launch.

**Attributes**:
- `id`: string - Unique error identifier
- `type`: "validation" | "docker" | "network" | "permission" | "extension" | "unknown"
- `code`: string - Machine-readable error code
- `message`: string - Human-readable error description
- `details`: object - Additional error context
- `recoveryActions`: RecoveryAction[] - Suggested fixes
- `timestamp`: Date - When error occurred
- `step`: LaunchStep - Launch phase where error occurred

### RecoveryAction
Represents a suggested action to resolve a container launch issue.

**Attributes**:
- `id`: string - Unique action identifier
- `type`: "manual" | "automated" | "configuration" | "installation"
- `title`: string - Action title
- `description`: string - Detailed description
- `steps`: string[] - Step-by-step instructions
- `command`: string - Command to execute (if applicable)
- `automated`: boolean - Whether action can be performed automatically
- `estimatedTime`: number - Estimated time to complete (minutes)

## Supporting Entities

### MountPoint
- `source`: string - Host path
- `target`: string - Container path
- `type`: "bind" | "volume" | "tmpfs"
- `readOnly`: boolean

### PortMapping
- `hostPort`: number - Host port number
- `containerPort`: number - Container port number
- `protocol`: "tcp" | "udp"

### DockerImage
- `name`: string - Image name
- `tag`: string - Image tag
- `size`: number - Image size in bytes
- `created`: Date - Creation timestamp

### DiskSpaceInfo
- `total`: number - Total disk space
- `available`: number - Available disk space
- `required`: number - Estimated required space

### PermissionStatus
- `canRunDocker`: boolean - Docker execution permission
- `canManageContainers`: boolean - Container management permission
- `canAccessDockerSocket`: boolean - Docker socket access
- `currentUser`: string - Current user name
- `dockerGroup`: boolean - Member of docker group

### LogEntry
- `timestamp`: Date - Log timestamp
- `level`: "debug" | "info" | "warn" | "error"
- `source`: string - Log source component
- `message`: string - Log message

### LaunchMetrics
- `validationTime`: number - Time spent on validation (ms)
- `buildTime`: number - Container build time (ms)
- `startTime`: number - Container start time (ms)
- `totalTime`: number - Total launch time (ms)
- `imageSize`: number - Final image size (bytes)

## State Transitions

### Container Launch Flow
```
pending → building → running → completed
    ↓         ↓         ↓
  failed    failed    failed
```

### Validation States
```
unvalidated → validating → valid/invalid
```

### Error Recovery Flow
```
error detected → analyze error → generate recovery actions → apply actions → retry
```

## Relationships

- DevContainerConfig 1:* ValidationError
- DockerEnvironment 1:* DockerImage
- ContainerLaunchContext 1 DevContainerConfig
- ContainerLaunchContext 1 DockerEnvironment
- ContainerLaunchContext 1:* ContainerError
- ContainerError 1:* RecoveryAction
- ContainerLaunchContext 1:* LogEntry
- ContainerLaunchContext 1 LaunchMetrics