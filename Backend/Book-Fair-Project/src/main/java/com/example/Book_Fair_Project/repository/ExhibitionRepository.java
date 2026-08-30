package com.example.Book_Fair_Project.repository;

import com.example.Book_Fair_Project.model.Exhibition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExhibitionRepository extends JpaRepository<Exhibition, Long> {
    List<Exhibition> findByIsActiveTrue();
}
