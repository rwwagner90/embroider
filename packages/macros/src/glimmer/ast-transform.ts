import { MacrosConfig } from '..';
import literal from './literal';
import getConfig from './get-config';
import dependencySatisfies from './dependency-satisfies';
import {
  macroIfBlock,
  macroIfExpression,
  maybeAttrs,
} from './macro-if';
import {
  moduleExistsExpression,
  moduleExistsMustache,
 } from './module-exists';

export function makeFirstTransform(config: MacrosConfig, baseDir?: string) {
  function embroiderFirstMacrosTransform(env: { syntax: { builders: any }, meta: { moduleName: string } }) {

    let scopeStack: string[][] = [];

    return {
      name: '@embroider/macros/first',

      visitor: {
        Program: {
          enter(node: any) {
            if (node.blockParams.length > 0) {
              scopeStack.push(node.blockParams);
            }
          },
          exit(node: any) {
            if (node.blockParams.length > 0) {
              scopeStack.pop();
            }
          }
        },
        SubExpression(node: any) {
          if (node.path.type !== 'PathExpression') {
            return;
          }
          if (inScope(scopeStack, node.path.parts[0])) {
            return;
          }
          if (node.path.original === 'macroGetOwnConfig') {
            return literal(getConfig(node, config, baseDir, env.meta.moduleName, true), env.syntax.builders);
          }
          if (node.path.original === 'macroGetConfig') {
            return literal(getConfig(node, config, baseDir, env.meta.moduleName, false), env.syntax.builders);
          }
          if (node.path.original === 'macroDependencySatisfies') {
            return literal(dependencySatisfies(node, config, baseDir, env.meta.moduleName), env.syntax.builders);
          }
          if (node.path.original === 'macroModuleExists') {
            return moduleExistsExpression(node, baseDir, env.meta.moduleName, env.syntax.builders);
          }
        },
        MustacheStatement(node: any) {
          if (node.path.type !== 'PathExpression') {
            return;
          }
          if (inScope(scopeStack, node.path.parts[0])) {
            return;
          }
          if (node.path.original === 'macroGetOwnConfig') {
            return env.syntax.builders.mustache(literal(getConfig(node, config, baseDir, env.meta.moduleName, true), env.syntax.builders));
          }
          if (node.path.original === 'macroGetConfig') {
            return env.syntax.builders.mustache(literal(getConfig(node, config, baseDir, env.meta.moduleName, false), env.syntax.builders));
          }
          if (node.path.original === 'macroDependencySatisfies') {
            return env.syntax.builders.mustache(literal(dependencySatisfies(node, config, baseDir, env.meta.moduleName), env.syntax.builders));
          }
          if (node.path.original === 'macroModuleExists') {
            return moduleExistsMustache(node, baseDir, env.meta.moduleName, env.syntax.builders);
          }
        }
      }
    };
  }
  (embroiderFirstMacrosTransform as any).embroiderMacrosASTMarker = true;
  return embroiderFirstMacrosTransform;
}

export function makeSecondTransform() {
  function embroiderSecondMacrosTransform(env: { syntax: { builders: any } }) {

    let scopeStack: string[][] = [];

    return {
      name: '@embroider/macros/second',

      visitor: {
        Program: {
          enter(node: any) {
            if (node.blockParams.length > 0) {
              scopeStack.push(node.blockParams);
            }
          },
          exit(node: any) {
            if (node.blockParams.length > 0) {
              scopeStack.pop();
            }
          }
        },
        BlockStatement(node: any) {
          if (node.path.type !== 'PathExpression') {
            return;
          }
          if (inScope(scopeStack, node.path.parts[0])) {
            return;
          }
          if (node.path.original === 'macroIf') {
            return macroIfBlock(node);
          }
        },
        SubExpression(node: any) {
          if (node.path.type !== 'PathExpression') {
            return;
          }
          if (inScope(scopeStack, node.path.parts[0])) {
            return;
          }
          if (node.path.original === 'macroIf') {
            return macroIfExpression(node, env.syntax.builders);
          }
        },
        ElementNode(node: any) {
          node.modifiers = node.modifiers.filter((modifier: any) => {
            if (modifier.path.type !== 'PathExpression') {
              return true;
            }
            if (inScope(scopeStack, modifier.path.parts[0])) {
              return true;
            }
            if (modifier.path.original === 'macroMaybeAttrs') {
              maybeAttrs(node, modifier, env.syntax.builders);
            }
          });
        },
        MustacheStatement(node: any) {
          if (node.path.type !== 'PathExpression') {
            return;
          }
          if (inScope(scopeStack, node.path.parts[0])) {
            return;
          }
          if (node.path.original === 'macroIf') {
            return env.syntax.builders.mustache(macroIfExpression(node, env.syntax.builders));
          }
        }
      }
    };
  }
  (embroiderSecondMacrosTransform as any).embroiderMacrosASTMarker = true;
  return embroiderSecondMacrosTransform;
}

function inScope(scopeStack: string[][], name: string) {
  for (let scope of scopeStack) {
    if (scope.includes(name)) {
      return true;
    }
  }
  return false;
}
