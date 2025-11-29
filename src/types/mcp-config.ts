export interface MCPServerConfiguration {
  serverName: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  timeout: number;
  enabled: boolean;
}