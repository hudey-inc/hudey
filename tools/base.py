"""Base tool interface for Hudey agent."""

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.actions import AgentAction, ToolResult
    from models.context import CampaignContext


class BaseTool(ABC):
    """Base class for tools the agent can execute."""

    action_type: str = ""

    @abstractmethod
    def execute(self, context: "CampaignContext", action: "AgentAction") -> "ToolResult":
        """Execute the tool given context and action. Returns ToolResult."""
        pass

    def can_handle(self, action_type: str) -> bool:
        """Whether this tool handles the given action type."""
        return action_type == self.action_type
