import { GuitarBuilder } from './builder'
import type { Guitar, GuitarSpec, GuitarType } from './types'

// Factory Method pattern: each subclass decides which builder variant to use.
// Currently all guitar types share one GuitarBuilder — subclasses would
// override createBuilder() to inject type-specific builder subclasses.
abstract class GuitarFactory {
  abstract createBuilder(): GuitarBuilder

  produce(spec: GuitarSpec): Guitar {
    return this.createBuilder()
      .setType(spec.type)
      .setBodyWood(spec.bodyWood)
      .setNeckWood(spec.neckWood)
      .setFretboardWood(spec.fretboardWood)
      .setPickups(spec.pickupConfig)
      .setFinish(spec.finish)
      .setScale(spec.scaleLength)
      .setModel(spec.modelSeries)
      .setNotes(spec.customNotes ?? '')
      .build()
  }
}

class ElectricGuitarFactory extends GuitarFactory {
  createBuilder(): GuitarBuilder { return new GuitarBuilder() }
}

class AcousticGuitarFactory extends GuitarFactory {
  createBuilder(): GuitarBuilder { return new GuitarBuilder() }
}

class BassGuitarFactory extends GuitarFactory {
  createBuilder(): GuitarBuilder { return new GuitarBuilder() }
}

class SemiHollowGuitarFactory extends GuitarFactory {
  createBuilder(): GuitarBuilder { return new GuitarBuilder() }
}

// Strategy: select the correct factory for the given type
const FACTORY_MAP: Record<GuitarType, GuitarFactory> = {
  electric: new ElectricGuitarFactory(),
  acoustic: new AcousticGuitarFactory(),
  bass: new BassGuitarFactory(),
  'semi-hollow': new SemiHollowGuitarFactory(),
}

export function selectFactory(type: GuitarType): GuitarFactory {
  return FACTORY_MAP[type]
}

export function produceGuitar(spec: GuitarSpec): Guitar {
  return selectFactory(spec.type).produce(spec)
}
