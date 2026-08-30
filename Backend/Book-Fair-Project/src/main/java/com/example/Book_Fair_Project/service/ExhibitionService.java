package com.example.Book_Fair_Project.service;

import com.example.Book_Fair_Project.model.Exhibition;
import java.util.List;

public interface ExhibitionService {
    List<Exhibition> getAllActiveExhibitions();
    Exhibition getExhibitionById(Long id);
    Exhibition createExhibition(Exhibition exhibition);
}
