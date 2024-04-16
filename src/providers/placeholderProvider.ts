import AbstractProvider, {
  EndpointArgument,
  ParseArgument,
  ProviderOptions,
  RequestType,
  SearchResult,
} from './provider';

export interface RequestResult {
  geocoding: object;
  features: RawResult[];
}

export type PlaceholderProviderOptions = {
  host?: string;
} & ProviderOptions;

export interface RawResult {
  id: number;
  name: string;
  placetype: string;
  population: number;
  geom: {
    area: number;
    bbox: string;
    lat: number;
    lon: number;
  };
}

export default class PlaceholderProvider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  // Placeholder servers are self-hosted so you'll need to configure the 'options.host' string
  // to identify where requests to your running placeholder/api server instance should be sent.
  // note: you SHOULD include the scheme, domain and port but NOT any path or parameters.
  // If you're using the Docker setup (https://github.com/pelias/placeholder)
  // then the default host of 'http://localhost:3000' will work out of the box.
  host: string;

  constructor(options: PlaceholderProviderOptions = {}) {
    super(options);
    this.host = options.host || 'http://localhost:3000';
  }

  endpoint({ query, type }: EndpointArgument) {
    const autocompleteParams =
      typeof query === 'string' ? { text: query } : query;
    return this.getUrl(`${this.host}/parser/search`, autocompleteParams);
  }

  parse(response: ParseArgument<RequestResult>): SearchResult<RawResult>[] {
    return response.data.features.map((feature) => {
      const bbox = feature.geom.bbox.split(',');
      const minx = parseFloat(bbox[0]);
      const miny = parseFloat(bbox[1]);
      const maxx = parseFloat(bbox[2]);
      const maxy = parseFloat(bbox[3]);

      const res: SearchResult<RawResult> = {
        x: feature.geom.lon,
        y: feature.geom.lat,
        label: feature.name,
        bounds: [
          [miny, minx],
          [maxy, maxx],
        ],
        raw: feature,
      };

      return res;
    });
  }
}
