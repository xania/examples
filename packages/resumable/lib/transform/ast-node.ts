import {
  ArrowFunctionExpression,
  BlockStatement,
  ClassDeclaration,
  ClassExpression,
  Declaration,
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Expression,
  ForStatement,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  ImportDeclaration,
  MethodDefinition,
  Pattern,
  PrivateIdentifier,
  Program,
  Property,
  PropertyDefinition,
  SpreadElement,
  ThisExpression,
  VariableDeclarator,
  WhileStatement,
} from 'estree';

export type ASTNode =
  | Declaration
  | BlockStatement
  | Expression
  | SpreadElement
  | Property
  | Pattern
  | ExportNamedDeclaration
  | ExportDefaultDeclaration
  | ClassDeclaration
  | ImportDeclaration
  | VariableDeclarator
  | ForStatement
  | Program
  | MethodDefinition
  | PropertyDefinition
  | WhileStatement
  | ThisExpression
  | PrivateIdentifier
  | ExportAllDeclaration;
