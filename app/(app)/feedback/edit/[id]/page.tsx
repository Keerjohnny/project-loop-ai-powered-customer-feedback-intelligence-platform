"use client";

import { useParams } from "next/navigation";

export default function EditFeedbackPage() {
  const params = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Edit Feedback</h1>
      <p className="mt-2 text-gray-600">Feedback ID: {params.id}</p>
    </div>
  );
}
