from pydantic import BaseModel
from datetime import datetime


class WorkflowBase(BaseModel):
    name: str
    input_data: str


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowResponse(BaseModel):
    id: int
    name: str
    input_data: str
    output_data: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class WorkflowRunResponse(BaseModel):
    output_data: str
    status: str
