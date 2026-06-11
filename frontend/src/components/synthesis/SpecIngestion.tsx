import { UploadCloud, FileJson, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface SpecIngestionProps {
  rawSpec: string;
  isSynthesizing: boolean;
  onSpecChange: (spec: string) => void;
  onSynthesize: () => void;
}

const SAMPLE_SPEC = `openapi: 3.0.0
info:
  title: Petstore Auth & Create Flow
  version: 1.0.0
servers:
  - url: https://api.petstore.example.com/v1
paths:
  /auth/token:
    post:
      summary: Get access token
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                client_id: { type: string }
                client_secret: { type: string }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token: { type: string }

  /pets:
    post:
      summary: Create a pet
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
                type: { type: string }
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                type: object
                properties:
                  id: { type: string }
                  name: { type: string }

  /pets/{petId}:
    get:
      summary: Get pet by ID
      security:
        - bearerAuth: []
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: OK

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
`;

export function SpecIngestion({
  rawSpec,
  isSynthesizing,
  onSpecChange,
  onSynthesize,
}: SpecIngestionProps) {
  const loadSample = () => {
    onSpecChange(SAMPLE_SPEC);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">
            OpenAPI Spec Ingestion
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Paste an OpenAPI 3.0/3.1 spec (YAML or JSON). Mistral AI will analyze it and infer an executable test flow.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSample}
            disabled={isSynthesizing}
            className="text-xs border-[#2a2a3e] hover:bg-[#1a1a2e]"
          >
            <FileJson className="h-3 w-3 mr-1.5" />
            Load Sample
          </Button>
          <Button
            onClick={onSynthesize}
            disabled={!rawSpec.trim() || isSynthesizing}
            className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[160px]"
          >
            {isSynthesizing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Synthesizing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Generate Agentic Flow
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="relative flex-1 group">
        <Textarea
          value={rawSpec}
          onChange={(e) => onSpecChange(e.target.value)}
          placeholder="Paste your OpenAPI specification here..."
          className="w-full h-full min-h-[300px] resize-none font-mono text-xs bg-[#0a0a0f] border-[#2a2a3e] p-4 text-slate-300 focus-visible:ring-1 focus-visible:ring-indigo-500/50 transition-all"
          spellCheck={false}
          disabled={isSynthesizing}
        />
        {!rawSpec && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity">
            <UploadCloud className="h-12 w-12 text-slate-500 mb-3" />
            <p className="text-sm font-medium text-slate-400">
              Paste or drop your OpenAPI spec
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
