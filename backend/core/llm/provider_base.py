from typing import Any, Dict, Protocol


class LLMProvider(Protocol):
    def generate(self, prompt: str) -> Dict[str, Any]: ...
