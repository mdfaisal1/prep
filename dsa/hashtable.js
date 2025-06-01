class HashTable {
    constructor(size) {
      this.data = new Array(size);
    }
  
    _hash(key) {
      let hash = 0;
      for (let char of key) {
        hash += char.charCodeAt(0);
      }
      return hash % this.data.length;
    }
  
    set(key, value) {
      const index = this._hash(key);
      if (!this.data[index]) this.data[index] = [];
      this.data[index].push([key, value]);
    }
  
    get(key) {
      const index = this._hash(key)
      const bucket = this.data[index]
      if(bucket){
        for(let [k, v] of bucket){
          if(k == key) return v
        }
      }
      return undefined
    }
    
  }
  
  const ht = new HashTable(34);
  ht.set("grapes", 1000);
  ht.set("coolss", 23);
  
  console.log(ht.data);
  console.log(ht.get("grapes"))
  console.log(ht.get("coolss"))
  