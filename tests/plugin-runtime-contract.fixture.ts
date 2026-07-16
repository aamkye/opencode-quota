import type { ServiceFactory } from "../shared/opencode-tools-shared.js"

type Assert<T extends true> = T
type HasDisposeKey<T> = "dispose" extends keyof T ? true : false

type _ObjectServiceFactoryMustExposeDispose = Assert<
  HasDisposeKey<ReturnType<ServiceFactory<{ id: number }>>>
>
