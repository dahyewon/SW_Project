import React from "react";
import { CanvasViewModel } from "./CanvasViewModel";
import { ShapeFactory } from "../entity/ShapeFactory";
import { Shape } from "../entity/Shape";

export interface ICanvasState {
  handleMouseDown(event: React.MouseEvent): void;
  handleMouseMove(event: React.MouseEvent): void;
  handleMouseUp(): void;
  getCurrentShapes(): Shape[];
}

export class DrawingState implements ICanvasState {
  private startX = 0;
  private startY = 0;
  private endX = 0;
  private endY = 0;
  private color = "black";
  private drawingShape: Shape | null = null;
  private drawing = false;
  constructor(private viewModel: CanvasViewModel) {}

  handleMouseDown(event: React.MouseEvent): void {
    const { offsetX, offsetY } = event.nativeEvent;

    //도형 클릭 시 이동 상태로 전환
    if (this.checkShapeClick(offsetX, offsetY)) {
      this.viewModel.setState(new MoveState(this.viewModel));
      return;
    }
    this.startX = offsetX;
    this.startY = offsetY;
    this.endX = offsetX;
    this.endY = offsetY;

    this.drawing = true;
  }

  handleMouseMove(event: React.MouseEvent): void {
    const { offsetX, offsetY } = event.nativeEvent;
    if (offsetX === this.endX && offsetY === this.endY) return; // 변화 없으면 무시
    if (!this.drawing) return;

    this.endX = offsetX;
    this.endY = offsetY;

    this.drawingShape = ShapeFactory.createShape(
      this.viewModel.getShapeType(),
      {
        id: this.viewModel.countShapes(),
        startX: this.startX,
        startY: this.startY,
        endX: this.endX,
        endY: this.endY,
        color: this.color,
      }
    );
  }

  handleMouseUp(): void {
    if (!this.drawing) return;
    this.drawing = false;
    if (this.drawingShape) {
      this.viewModel.addShape(this.drawingShape);
      this.drawingShape = null; // reset drawing shape
    }
  }

  getCurrentShapes(): Shape[] {
    if (this.drawing) {
      return this.drawingShape
        ? [...this.viewModel.getSavedShapes(), this.drawingShape]
        : this.viewModel.getSavedShapes();
    }
    return this.viewModel.getSavedShapes();
  }

  checkShapeClick(offsetX: number, offsetY: number): boolean {
    const shapes = this.viewModel.getSavedShapes();
    shapes.forEach((shape) => {
      if (
        offsetX >= Math.min(shape.startX, shape.endX) &&
        offsetX <= Math.max(shape.startX, shape.endX) &&
        offsetY >= Math.min(shape.startY, shape.endY) &&
        offsetY <= Math.max(shape.startY, shape.endY)
      ) {
        return true;
      }
    });

    return false;
  }
}

export class SelectState implements ICanvasState {
  private startX = 0;
  private startY = 0;
  private endX = 0;
  private endY = 0;
  private selecting = false;
  constructor(private viewModel: CanvasViewModel) {}

  handleMouseDown(event: React.MouseEvent): void {
    const { offsetX, offsetY } = event.nativeEvent;
    this.startX = offsetX;
    this.startY = offsetY;
    this.endX = offsetX;
    this.endY = offsetY;

    this.viewModel.clearSelectedShapes();

    this.selecting = true; //TODO: 시작점이 도형 내부라면 바로 select, 아니라면 다중 select
  }

  handleMouseMove(event: React.MouseEvent): void {
    const { offsetX, offsetY } = event.nativeEvent;
    if (offsetX === this.endX && offsetY === this.endY) return; // 변화 없으면 무시
    if (!this.selecting) return;

    this.endX = offsetX;
    this.endY = offsetY;

    this.viewModel.clearSelectedShapes();
    this.selectShapes(this.startX, this.startY, this.endX, this.endY);
  }

  handleMouseUp(): void {
    console.log(this.viewModel.getSelectedShapes());
  }

  selectShapes(startX: number, startY: number, endX: number, endY: number) {
    this.viewModel.clearSelectedShapes();

    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    this.viewModel.getSavedShapes().forEach((shape) => {
      const shapeMinX = Math.min(shape.startX, shape.endX);
      const shapeMaxX = Math.max(shape.startX, shape.endX);
      const shapeMinY = Math.min(shape.startY, shape.endY);
      const shapeMaxY = Math.max(shape.startY, shape.endY);

      if (
        !(shapeMaxX < minX || maxX < shapeMinX) &&
        !(shapeMaxY < minY || maxY < shapeMinY)
      ) {
        this.viewModel.addSelectedShapes(shape);
      }
    });
  }

  getCurrentShapes(): Shape[] {
    return this.viewModel.getSavedShapes();
  }
}

export class MoveState implements ICanvasState {
  private selectedShapes: Shape[] | null = null;
  private startX: number = 0;
  private startY: number = 0;
  private endX: number = 0;
  private endY: number = 0;
  private moving = false;

  constructor(private viewModel: CanvasViewModel) {}

  handleMouseDown(event: React.MouseEvent): void {
    const { offsetX, offsetY } = event.nativeEvent;
    this.startX = offsetX;
    this.startY = offsetY;

    this.selectedShapes = this.viewModel.getSelectedShapes();
    this.moving = true;
  }

  handleMouseMove(event: React.MouseEvent): void {
    if (!this.moving) return;
    const { offsetX, offsetY } = event.nativeEvent;
    if (offsetX === this.endX && offsetY === this.endY) return;

    this.endX = offsetX;
    this.endY = offsetY;

    const dx = this.startX - this.endX;
    const dy = this.startY - this.endY;
    this.startX = offsetX;
    this.startY = offsetY;

    if (this.selectedShapes) {
      this.viewModel.moveSelectedShapes(dx, dy); // move selected shapes
    }
  }

  handleMouseUp(): void {
    this.moving = false;
    this.selectedShapes = null; // reset selected shapes
    this.viewModel.setState(new SelectState(this.viewModel)); // switch back to select state
  }

  getCurrentShapes(): Shape[] {
    return this.viewModel.getSavedShapes();
  }
}
