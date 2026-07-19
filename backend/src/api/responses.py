from typing import Any
from fastapi import status
from fastapi.responses import JSONResponse


def success_response(
    data: Any = None,
    message: str = "Success",
    status_code: int = status.HTTP_200_OK,
    meta: dict | None = None,
) -> JSONResponse:
    body: dict[str, Any] = {"success": True, "message": message, "data": data}
    if meta:
        body["meta"] = meta
    return JSONResponse(content=body, status_code=status_code)


def error_response(
    message: str = "Error",
    status_code: int = status.HTTP_400_BAD_REQUEST,
    data: Any = None,
    meta: dict | None = None,
) -> JSONResponse:
    body: dict[str, Any] = {"success": False, "message": message, "data": data}
    if meta:
        body["meta"] = meta
    return JSONResponse(content=body, status_code=status_code)


def paginated_response(
    data: list,
    total: int,
    skip: int,
    limit: int,
    message: str = "Success",
) -> JSONResponse:
    return JSONResponse(
        content={
            "success": True,
            "message": message,
            "data": data,
            "meta": {
                "total": total,
                "skip": skip,
                "limit": limit,
            },
        },
        status_code=status.HTTP_200_OK,
    )
