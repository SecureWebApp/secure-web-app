/*
 * This file documents the exact function definition of the function module.js should export.
 * Besides documentation this file has no functional significance.
 */

import { Application } from "express"
import Logger from "../src/logging/shared/loggerClass"
import ModuleCache from "../src/modules/shared/moduleCacheClass"
import Module from "../src/modules/shared/moduleClass"

export type ModuleFunction = (app: Application, cache: ModuleCache, logger: Logger, module: Module) => any
