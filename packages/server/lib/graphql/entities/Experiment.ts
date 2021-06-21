import { nxs } from 'nexus-decorators'

@nxs.objectType({
  description: 'A feature flag that can be enabled',
})
export class Experiment {
  @nxs.field.string()
  get name () {
    return ''
  }
}