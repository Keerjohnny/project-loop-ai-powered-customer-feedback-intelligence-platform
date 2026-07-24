-- CreateTable
CREATE TABLE "public"."ChatHistory" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatHistory_workspaceId_idx" ON "public"."ChatHistory"("workspaceId");

-- AddForeignKey
ALTER TABLE "public"."ChatHistory" ADD CONSTRAINT "ChatHistory_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
