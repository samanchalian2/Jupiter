/** OAS 3.0 uses draft-4-style boolean exclusive bounds; Ajv 8 uses draft-7
 * numeric bounds. Translate only that representation, not validation rules. */
export function jsonSchema(value:unknown):unknown {
 if(Array.isArray(value))return value.map(jsonSchema);
 if(!value||typeof value!=='object')return value;
 const schema=Object.fromEntries(Object.entries(value).map(([key,item])=>[key,jsonSchema(item)]));
 for(const [exclusive,bound]of [['exclusiveMinimum','minimum'],['exclusiveMaximum','maximum']]){
  if(typeof schema[exclusive]==='boolean'){if(schema[exclusive]){schema[exclusive]=schema[bound];delete schema[bound];}else delete schema[exclusive];}
 }
 return schema;
}
