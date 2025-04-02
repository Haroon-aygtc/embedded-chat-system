import React from "react";
import { Button } from "@/components/ui/button";

interface FollowUpQuestionsProps {
  questions: string[];
  onSelectQuestion: (question: string) => void;
  displayStyle?: "buttons" | "chips" | "list";
}

const FollowUpQuestions: React.FC<FollowUpQuestionsProps> = ({
  questions,
  onSelectQuestion,
  displayStyle = "buttons",
}) => {
  if (!questions || questions.length === 0) {
    return null;
  }

  if (displayStyle === "chips") {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelectQuestion(question)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            {question}
          </button>
        ))}
      </div>
    );
  }

  if (displayStyle === "list") {
    return (
      <div className="mt-2 space-y-1">
        {questions.map((question, index) => (
          <div
            key={index}
            onClick={() => onSelectQuestion(question)}
            className="text-sm text-blue-600 hover:underline cursor-pointer"
          >
            {question}
          </div>
        ))}
      </div>
    );
  }

  // Default: buttons
  return (
    <div className="flex flex-col gap-2 mt-2">
      {questions.map((question, index) => (
        <Button
          key={index}
          variant="outline"
          onClick={() => onSelectQuestion(question)}
          className="justify-start text-left h-auto py-2"
        >
          {question}
        </Button>
      ))}
    </div>
  );
};

export default FollowUpQuestions;
