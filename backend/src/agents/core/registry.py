from typing import Type
from src.agents.core.base import BaseAgent


class AgentRegistry:
    """Global registry of available agents."""

    _agents: dict[str, BaseAgent] = {}

    @classmethod
    def register(cls, agent_cls: Type[BaseAgent]) -> BaseAgent:
        instance = agent_cls()
        cls._agents[instance.agent_name] = instance
        return instance

    @classmethod
    def get(cls, name: str) -> BaseAgent | None:
        return cls._agents.get(name)

    @classmethod
    def list_agents(cls) -> list[BaseAgent]:
        return list(cls._agents.values())

    @classmethod
    def is_registered(cls, name: str) -> bool:
        return name in cls._agents
