package com.orangy.media;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaretakerRepository extends MongoRepository<Caretaker, String> {

    List<Caretaker> findAllByOrderBySortOrderAsc();
}
