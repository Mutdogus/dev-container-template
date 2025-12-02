# Use Python 3.11 slim as base image
FROM python:3.11-slim

# Set non-interactive frontend for package installation
ENV DEBIAN_FRONTEND=noninteractive

# Layer 1: System dependencies and base setup (changes rarely)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    wget \
    gnupg \
    ca-certificates \
    build-essential \
    sudo \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Layer 2: Programming runtimes (changes occasionally)
# Install Node.js for VS Code extensions with error handling
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && node --version \
    && npm --version \
    && apt-get clean

# Layer 3: Python tools (changes infrequently)
# Install uv for Python package management
RUN curl -LsSf https://astral.sh/uv/install.sh | sh \
    && export PATH="/root/.local/bin:$PATH" \
    && /root/.local/bin/uv --version

# Install basic Python tools using pip
RUN pip install --no-cache-dir \
    black \
    flake8 \
    pytest \
    virtualenv

# Install additional Python development tools with uv
RUN export PATH="/root/.local/bin:$PATH" \
    && /root/.local/bin/uv tool install ruff \
    && /root/.local/bin/uv tool install mypy \
    && echo "Installing specify-cli for Spec-Driven Development..." \
    && /root/.local/bin/uv tool install specify-cli --from git+https://github.com/github/spec-kit.git \
    && echo "Verifying specify-cli installation..." \
    && /root/.local/bin/uv tool list | grep specify

# Layer 4: User configuration (changes rarely)
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Create non-root user with proper permissions
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME -s /bin/bash \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# Set working directory
WORKDIR /workspaces

# Create directories for configurations with proper ownership
RUN mkdir -p /home/$USERNAME/.config/opencode \
    && mkdir -p /home/$USERNAME/.config/specify \
    && mkdir -p /home/$USERNAME/.local/bin \
    && chown -R $USERNAME:$USERNAME /home/$USERNAME

# Layer 5: Base environment variables (consolidated)
ENV PYTHONPATH="/workspaces" \
    PATH="/usr/local/bin:/usr/bin:/bin:/home/${USERNAME}/.local/bin:/home/${USERNAME}/.opencode/bin" \
    OPENCODE_CONFIG_DIR="/home/${USERNAME}/.config/opencode" \
    SPECIFY_CONFIG_DIR="/home/${USERNAME}/.config/specify"

# Switch to non-root user
USER $USERNAME

# Layer 6: User-specific tool installation (changes most frequently)
# Install OpenCode CLI with primary installer and fallback mechanism
RUN echo "=== OpenCode CLI Installation Started ===" \
    && echo "Timestamp: $(date)" \
    && echo "Creating installation directories..." \
    && mkdir -p ~/.opencode/bin \
    && mkdir -p ~/.opencode/logs \
    && echo "Attempting primary installation using official installer..." \
    && curl -fsSL https://install.opencode.ai | sh 2>&1 | tee ~/.opencode/logs/primary-install.log \
    && if command -v opencode >/dev/null 2>&1 && opencode --version >/dev/null 2>&1; then \
        echo "✅ Primary installation successful" \
        && opencode --version 2>&1 | tee ~/.opencode/logs/version-check.log; \
    else \
        echo "❌ Primary installation failed, attempting fallback..." \
        && echo "Detecting system architecture..." \
        && ARCH=$(uname -m | sed 's/x86_64/amd64/' | sed 's/aarch64/arm64/') \
        && echo "Detected architecture: $ARCH" \
        && echo "Downloading OpenCode binary for $ARCH..." \
        && curl -fsSL "https://github.com/sst/opencode/releases/latest/download/opencode-linux-${ARCH}.tar.gz" -o /tmp/opencode.tar.gz \
        && echo "Extracting OpenCode binary..." \
        && tar -xzf /tmp/opencode.tar.gz -C ~/.opencode/bin \
        && echo "Setting executable permissions..." \
        && chmod +x ~/.opencode/bin/opencode \
        && echo "Verifying fallback installation..." \
        && ~/.opencode/bin/opencode --version 2>&1 | tee ~/.opencode/logs/fallback-version.log \
        && echo "✅ Fallback installation successful"; \
    fi \
    && echo "=== OpenCode Installation Completed ===" \
    && echo "Final verification..." \
    && ~/.opencode/bin/opencode --version \
    && echo "Testing OpenCode CLI functionality..." \
    && ~/.opencode/bin/opencode --help | head -5 \
    && echo "✅ OpenCode CLI is ready to use" \
    && echo "Installation logs available in ~/.opencode/logs/" \
    && echo "=== Setting up Python development environment ===" \
    && export PATH="/root/.cargo/bin:$PATH" \
    && echo "Setting up uv for user..." \
    && curl -LsSf https://astral.sh/uv/install.sh | sh \
    && echo 'export PATH="/home/vscode/.cargo/bin:$PATH"' >> ~/.bashrc \
    && echo 'export PATH="/home/vscode/.local/bin:$PATH"' >> ~/.bashrc \
    && echo "=== Verifying user environment setup ===" \
    && echo "Testing git configuration..." \
    && git config --global user.name "Developer" \
    && git config --global user.email "developer@example.com" \
    && git --version \
    && echo "Testing Node.js and npm..." \
    && node --version \
    && npm --version \
    && echo "Testing Python tools..." \
    && python --version \
    && pip --version \
    && pytest --version \
    && echo "Testing file system permissions..." \
    && touch ~/test-file.txt \
    && echo "User file creation: SUCCESS" \
    && rm ~/test-file.txt \
    && echo "=== User environment setup completed ==="

# Set default command
CMD ["/bin/bash"]