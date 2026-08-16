package com.orangy.media;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaAssetRepository extends MongoRepository<MediaAsset, String> {

    List<MediaAsset> findByRefTypeOrderBySortOrderAsc(RefType refType);

    List<MediaAsset> findByRefTypeAndRefIdOrderBySortOrderAsc(RefType refType, String refId);

    MediaAsset findFirstByRefType(RefType refType);
}
